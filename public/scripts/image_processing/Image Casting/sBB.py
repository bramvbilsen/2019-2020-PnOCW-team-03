import cv2
import numpy as np
import sys
import time

def isolatePolygon():
    image_path = './img/polygon.jpg'
    image = cv2.imread(image_path)

    # create a mask with white pixels
    mask = np.ones(image.shape, dtype=np.uint8)
    mask.fill(255)

    # points to be cropped
    roi_corners = np.array([[(10, 240), (23, 400), (200, 501),(239, 230)]], dtype=np.int32)
    # fill the ROI into the mask
    cv2.fillConvexPoly(mask, roi_corners, 0)

    # The mask image
    cv2.imwrite('image_masked.png', mask)

    # applying th mask to original image
    masked_image = cv2.bitwise_or(image, mask)

    # The resultant image
    cv2.imwrite('./img/new_masked_image.png', masked_image)
    return

def minBoundingRect(hull_points_2d):
    nanosec = time.time_ns()
    #print "Input convex hull points: "
    #print hull_points_2d

    # Compute edges (x2-x1,y2-y1)
    edges = np.zeros( (len(hull_points_2d)-1,2) ) # empty 2 column array
    for i in range( len(edges) ):
        edge_x = hull_points_2d[i+1][0] - hull_points_2d[i][0]
        edge_y = hull_points_2d[i+1][1] - hull_points_2d[i][1]
        edges[i] = [edge_x,edge_y]
    print ("Edges: \n", edges)

    # Calculate edge angles   atan2(y/x)
    edge_angles = np.zeros( (len(edges)) ) # empty 1 column array
    for i in range( len(edge_angles) ):
        edge_angles[i] = np.math.atan2( edges[i][1], edges[i][0] )
    #print "Edge angles: \n", edge_angles

    # Check for angles in 1st quadrant
    for i in range( len(edge_angles) ):
        edge_angles[i] = abs( edge_angles[i] % (np.math.pi/2) ) # want strictly positive answers
    #print "Edge angles in 1st Quadrant: \n", edge_angles

    # Remove duplicate angles
    edge_angles = np.unique(edge_angles)
    #print "Unique edge angles: \n", edge_angles

    # Test each angle to find bounding box with smallest area
    min_bbox = (0, sys.maxsize, 0, 0, 0, 0, 0, 0) # rot_angle, area, width, height, min_x, max_x, min_y, max_y
    print ("Testing", len(edge_angles), "possible rotations for bounding box... \n")
    for i in range( len(edge_angles) ):

        # Create rotation matrix to shift points to baseline
        # R = [ cos(theta)      , cos(theta-PI/2)
        #       cos(theta+PI/2) , cos(theta)     ]
        R = np.array([ [ np.math.cos(edge_angles[i]), np.math.cos(edge_angles[i]-(np.math.pi/2)) ], [ np.math.cos(edge_angles[i]+(np.math.pi/2)), np.math.cos(edge_angles[i]) ] ])
        #print "Rotation matrix for ", edge_angles[i], " is \n", R

        # Apply this rotation to convex hull points
        rot_points = np.dot(R, np.transpose(hull_points_2d) ) # 2x2 * 2xn
        #print "Rotated hull points are \n", rot_points

        # Find min/max x,y points
        min_x = np.nanmin(rot_points[0], axis=0)
        max_x = np.nanmax(rot_points[0], axis=0)
        min_y = np.nanmin(rot_points[1], axis=0)
        max_y = np.nanmax(rot_points[1], axis=0)
        #print "Min x:", min_x, " Max x: ", max_x, "   Min y:", min_y, " Max y: ", max_y

        # Calculate height/width/area of this bounding rectangle
        width = max_x - min_x
        height = max_y - min_y
        area = width*height
        #print "Potential bounding box ", i, ":  width: ", width, " height: ", height, "  area: ", area 

        # Store the smallest rect found first (a simple convex hull might have 2 answers with same area)
        if (area < min_bbox[1]):
            min_bbox = ( edge_angles[i], area, width, height, min_x, max_x, min_y, max_y )
        # Bypass, return the last found rect
        #min_bbox = ( edge_angles[i], area, width, height, min_x, max_x, min_y, max_y )

    # Re-create rotation matrix for smallest rect
    angle = min_bbox[0]   
    R = np.array([ [ np.math.cos(angle), np.math.cos(angle-(np.math.pi/2)) ], [ np.math.cos(angle+(np.math.pi/2)), np.math.cos(angle) ] ])
    #print "Projection matrix: \n", R

    # Project convex hull points onto rotated frame
    proj_points = np.dot(R, np.transpose(hull_points_2d) ) # 2x2 * 2xn
    #print "Project hull points are \n", proj_points

    # min/max x,y points are against baseline
    min_x = min_bbox[4]
    max_x = min_bbox[5]
    min_y = min_bbox[6]
    max_y = min_bbox[7]
    #print "Min x:", min_x, " Max x: ", max_x, "   Min y:", min_y, " Max y: ", max_y

    # Calculate center point and project onto rotated frame
    center_x = (min_x + max_x)/2
    center_y = (min_y + max_y)/2
    center_point = np.dot( [ center_x, center_y ], R )
    #print "Bounding box center point: \n", center_point

    # Calculate corner points and project onto rotated frame
    corner_points = np.zeros( (4,2) ) # empty 2 column array
    corner_points[0] = np.dot( [ max_x, min_y ], R )
    corner_points[1] = np.dot( [ min_x, min_y ], R )
    corner_points[2] = np.dot( [ min_x, max_y ], R )
    corner_points[3] = np.dot( [ max_x, max_y ], R )
    #print "Bounding box corner points: \n", corner_points

    #print "Angle of rotation: ", angle, "rad  ", angle * (180/np.math.pi), "deg"
    #angle, min_bbox[1], min_bbox[2], min_bbox[3],
    new_nanosec = time.time_ns()
    nanosec = new_nanosec-nanosec
    print('time:',nanosec)
    return (center_point, corner_points) # rot_angle, area, width, height, center_point, corner_points


if __name__ == '__main__':
    list = [[0,0],[2,4],[4,5],[1,7],[0,0]]
    #list.append((0, 0), (2,4), (4,5), (1,7), (0,0))
    print(minBoundingRect(list))